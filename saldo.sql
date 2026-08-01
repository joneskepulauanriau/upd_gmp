-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 01, 2026 at 04:09 PM
-- Server version: 10.1.38-MariaDB
-- PHP Version: 7.2.17

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_gmp`
--

-- --------------------------------------------------------

--
-- Table structure for table `saldo`
--

DROP TABLE IF EXISTS `saldo`;
CREATE TABLE `saldo` (
  `id_transaksi` int(11) NOT NULL,
  `tgl_transaksi` datetime NOT NULL,
  `uraian` varchar(100) DEFAULT NULL,
  `jumlah` int(11) DEFAULT '0',
  `kode_transaksi` char(1) DEFAULT NULL COMMENT 'D=Debet\r\nK=Kredit'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 PACK_KEYS=0;

--
-- Dumping data for table `saldo`
--

INSERT INTO `saldo` (`id_transaksi`, `tgl_transaksi`, `uraian`, `jumlah`, `kode_transaksi`) VALUES
(1, '2026-12-02 00:00:00', 'Donasi Atas Nama Muhammad Yunus', 100000, 'D'),
(2, '2026-12-02 00:00:00', 'Donasi Atas Nama Dharma', 100000, 'D'),
(3, '2026-12-04 00:00:00', 'Donasi Atas Nama Chandra', 20000, 'D'),
(4, '2026-12-05 00:00:00', 'Token Listrik 50.000', 50000, 'K');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `saldo`
--
ALTER TABLE `saldo`
  ADD UNIQUE KEY `id_transaksi` (`id_transaksi`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `saldo`
--
ALTER TABLE `saldo`
  MODIFY `id_transaksi` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
